//
//  ActivityDetailViewController.h
//  Activities
//
//  Created by Owen Campbell-Moore on 01/08/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Activity.h"

@interface ActivityDetailViewController : UIViewController {
    Activity *activity;
}

@property (weak, nonatomic) IBOutlet UILabel *descriptionLabel;
@property (weak, nonatomic) IBOutlet UILabel *locationLabel;

- (void)setActivity:(Activity*)theActivity;

@end
