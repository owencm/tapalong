//
//  ActivityTableCell.h
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface ActivityTableCell : UITableViewCell

@property (nonatomic, weak) IBOutlet UILabel *activityLabel;
@property (weak, nonatomic) IBOutlet UILabel *descriptionLabel;
@property (weak, nonatomic) IBOutlet UILabel *locationLabel;
@property (weak, nonatomic) IBOutlet UIButton *tapAlongButton;
@property (assign, nonatomic) int cellHeight;

-(void)refreshLayout;

@end
