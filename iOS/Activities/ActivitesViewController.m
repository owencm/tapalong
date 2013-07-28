//
//  ActivitesViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivitesViewController.h"
#import "ActivityTableCell.h"
#import <RestKit/RestKit.h>
#import "Activity.h"

@interface ActivitesViewController ()

@end

@implementation ActivitesViewController

- (id)initWithStyle:(UITableViewStyle)style
{
    self = [super initWithStyle:style];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    self.activities = [[NSArray alloc] init];

    [self loadActivities];
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
 
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
}

- (void)setTextInCell:(ActivityTableCell *)cell activityTitle:(NSString *) activityTitle userName:(NSString *)userName {
    
    NSString *joinedString = [[userName stringByAppendingString:@" is "] stringByAppendingString:activityTitle];
    
    // Define general attributes for the entire text
    NSDictionary *attribs = @{
                              NSForegroundColorAttributeName: cell.activityLabel.textColor,
                              };
    
    UIFont *largeText = [UIFont fontWithName:@"Roboto" size:16];
    UIFont *smallText = [UIFont fontWithName:@"Roboto-Light" size:14];
    
    NSMutableAttributedString *attributedText =
    [[NSMutableAttributedString alloc] initWithString:joinedString
                                           attributes:attribs];

    NSRange userNameRange = {0, [userName length]};
    NSRange isRange = {[userName length], 4};
    NSRange activityRange = {[userName length]+4, [activityTitle length]};
    
    [attributedText setAttributes:@{NSFontAttributeName: largeText}
                            range:userNameRange];
    [attributedText setAttributes:@{NSFontAttributeName: smallText}
                            range:isRange];
    [attributedText setAttributes:@{NSFontAttributeName: largeText}
                            range:activityRange];
    
    cell.activityLabel.attributedText = attributedText;
    
}

- (void)loadActivities
{
    RKObjectMapping *activityMapping = [RKObjectMapping mappingForClass:[Activity class]];
    [activityMapping addAttributeMappingsFromDictionary:@{
     @"title": @"title",
     @"start_time": @"start_time",
     @"location": @"location",
     @"max_attendees": @"max_attendees",
     @"description": @"description"
    }];
    
    RKResponseDescriptor *responseDescriptor = [RKResponseDescriptor responseDescriptorWithMapping:activityMapping pathPattern:nil keyPath:@"activity" statusCodes:RKStatusCodeIndexSetForClass(RKStatusCodeClassSuccessful)];
    
    NSURL *URL = [NSURL URLWithString:@"http://127.0.0.1:8000/activities/1/"];
    NSURLRequest *request = [NSURLRequest requestWithURL:URL];
    RKObjectRequestOperation *objectRequestOperation = [[RKObjectRequestOperation alloc] initWithRequest:request responseDescriptors:@[ responseDescriptor ]];
    [objectRequestOperation setCompletionBlockWithSuccess:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
//        RKLogInfo(@"Load collection of Activities: %@", mappingResult.array);
        self.activities = mappingResult.array;
        [self.tableView reloadData];
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        RKLogError(@"Operation failed with error: %@", error);
    }];
    
    [objectRequestOperation start];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return [self.activities count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell Identifier";
    ActivityTableCell *cell = (ActivityTableCell *)[tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    if (cell == nil)
    {
        NSArray *nib = [[NSBundle mainBundle] loadNibNamed:@"ActivityTableCell" owner:self options:nil];
        cell = [nib objectAtIndex:0];
    }
    
    NSString *activityTitle = [[self.activities objectAtIndex:indexPath.row] title];
    // Todo: pull other info correctly
    NSString *userName = @"Owen Campbell-Moore";
    [self setTextInCell :cell activityTitle:activityTitle userName:userName];
    
    // Todo: Put these in the right place
//    cell.autoresizingMask = UIViewAutoresizingFlexibleHeight;
//    cell.clipsToBounds = YES;
    
    return cell;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (self.selectedCell && indexPath.row == self.selectedCell.row) {
        return 126;
    } else {
        return 86;
    }
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    self.selectedCell = indexPath;
    ActivityTableCell *cell = (ActivityTableCell *)[tableView cellForRowAtIndexPath:indexPath];
    [tableView beginUpdates];
    [tableView endUpdates];
    [cell.detailsButton setTitle:@"Hide Details" forState:UIControlStateNormal];
    //    cell.activityLabel.hidden = NO;
}

-(void)tableView:(UITableView *)tableView didDeselectRowAtIndexPath:(NSIndexPath *)indexPath {
    ActivityTableCell *cell = (ActivityTableCell *)[tableView cellForRowAtIndexPath:indexPath];
    [tableView beginUpdates];
    [tableView endUpdates];
    [cell.detailsButton setTitle:@"Details" forState:UIControlStateNormal];
//    cell.activityLabel.hidden = YES;
}

@end
